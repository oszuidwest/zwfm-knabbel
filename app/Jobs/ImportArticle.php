<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\View;
use League\HTMLToMarkdown\HtmlConverter;
use Symfony\Component\DomCrawler\Crawler;

class ImportArticle implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $url
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $uri = \League\Uri\Http::new($this->url);

        // TODO: Make this configurable
        if ($uri->getHost() !== 'www.zuidwestupdate.nl') {
            $this->fail('Invalid host');

            return;
        }

        $html = Http::get($this->url)->throw()->body();
        $crawler = new Crawler($html);
        $bodyClasses = $crawler->filter('body')->first()->attr('class');
        $bodyClasses = preg_split('/\s+/', $bodyClasses);

        if (! in_array('single-post', $bodyClasses)) {
            $this->fail('Not a single post');

            return;
        }

        $postId = null;
        foreach ($bodyClasses as $class) {
            if (preg_match('/^postid-(\d+)$/', $class, $matches)) {
                $postId = $matches[1];
                break;
            }
        }

        if (! $postId) {
            $this->fail('Could not find post ID');

            return;
        }

        $json = Http::get(sprintf('https://www.zuidwestupdate.nl/wp-json/wp/v2/posts/%d', $postId))->throw()->json();

        $post = new class
        {
            public string $title;

            public string $content;
        };
        $converter = new HtmlConverter([
            'header_style' => 'atx',
        ]);
        $post->title = html_entity_decode($converter->convert($json['title']['rendered']));

        $content = $json['content']['rendered'];
        $content = new Crawler($content);

        // TODO: add a configuration option with query selectors to remove
        $content->filter('a[data-post-id], figure')->each(function (Crawler $node) {
            /** @var \DOMElement $el */
            $el = $node->getNode(0);
            $el->remove();
        });

        $post->content = html_entity_decode($converter->convert($content->html()));
        $prompt = View::make('prompt', ['post' => $post])->render();

        $messages = [];
        // TODO: Add a system message
        $messages[] = [
            'role' => 'user',
            'content' => $prompt,
        ];

        // TODO: make model configurable
        // TODO: make endpoint configurable
        $chatResponse = Http::withToken(config('services.openai.api_key'))
            ->post(
                'https://api.openai.com/v1/chat/completions',
                [
                    'model' => config('services.openai.model'),
                    'messages' => $messages,
                ]
            )
            ->throw()
            ->json();

        $output = $chatResponse['choices'][0]['message']['content'];

        $article = new \App\Models\Article();
        $article->url = $this->url;
        $article->wordpress_id = $postId;
        $article->prompt = $prompt;
        $article->ai_model = $chatResponse['model'];
        $article->ai_summary = $output;
        $article->save();
    }
}
