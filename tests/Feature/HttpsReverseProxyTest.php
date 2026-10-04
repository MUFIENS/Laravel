<?php

test('trusts reverse proxy https forwarded proto header and generates https asset urls', function () {
    $response = $this->withHeaders([
        'X-Forwarded-Proto' => 'https',
        'X-Forwarded-For' => '104.28.194.5',
        'X-Forwarded-Port' => '443',
        'X-Forwarded-Host' => 'laravel-production-13be.up.railway.app',
    ])->get('/');

    $response->assertOk();

    // Verify request is recognized as HTTPS
    expect(request()->isSecure())->toBeTrue();
    expect(request()->getScheme())->toBe('https');

    // Verify generated HTML contains https for assets
    $html = $response->getContent();
    expect($html)->toContain('https://laravel-production-13be.up.railway.app/build/assets/');
    expect($html)->not->toContain('http://laravel-production-13be.up.railway.app/build/assets/');
});
