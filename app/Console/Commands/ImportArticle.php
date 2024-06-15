<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\View;
use League\HTMLToMarkdown\HtmlConverter;
use Symfony\Component\DomCrawler\Crawler;

class ImportArticle extends Command
{
    protected $signature = 'app:import-article {url}';

    public function handle()
    {
        $uri = \League\Uri\Http::new($this->argument('url'));

        // TODO: Make this configurable
        if ($uri->getHost() !== 'www.zuidwestupdate.nl') {
            $this->error('Invalid host');

            return 1;
        }

        $html = Http::get($this->argument('url'))->throw()->body();
        $crawler = new Crawler($html);
        $bodyClasses = $crawler->filter('body')->first()->attr('class');
        $bodyClasses = preg_split('/\s+/', $bodyClasses);

        if (! in_array('single-post', $bodyClasses)) {
            $this->error('Not a single post');

            return 1;
        }

        $postId = null;
        foreach ($bodyClasses as $class) {
            if (preg_match('/^postid-(\d+)$/', $class, $matches)) {
                $postId = $matches[1];
                break;
            }
        }

        if (! $postId) {
            $this->error('Could not find post ID');

            return 1;
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
        $content->filter('a[data-post-id]')->each(function (Crawler $node) {
            /** @var \DOMElement $el */
            $el = $node->getNode(0);
            $el->remove();
        });

        $post->content = html_entity_decode($converter->convert($content->html()));
        $prompt = View::make('prompt', ['post' => $post])->render();

        $this->info($prompt);

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

        $this->output->write($output);
    }
}
