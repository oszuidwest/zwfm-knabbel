<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auth/redirect', function () {
    return Socialite::driver('azure')->redirect();
});

Route::get('/auth/callback', function () {
    $azureUser = Socialite::driver('azure')->user();

    $user = User::updateOrCreate([
        'email' => $azureUser->email,
    ], [
        'name' => $azureUser->name,
        'email' => $azureUser->email
    ]);

    Auth::login($user);

    return redirect('/');
});
