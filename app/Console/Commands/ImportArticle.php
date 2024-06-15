<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ImportArticle extends Command
{
    protected $signature = 'app:import-article {url}';

    public function handle()
    {
        $job = new \App\Jobs\ImportArticle($this->argument('url'));
        dispatch_sync($job);

    }
}
