<?php

use App\Http\Controllers\Testing\ResetDatabaseController;
use App\Models\Course;
use App\Models\Lesson;

use function Pest\Laravel\postJson;

beforeEach(function () {
    Course::truncate();
    Lesson::truncate();
});

it('is not routed outside the e2e environment', function () {
    postJson('/api/testing/reset')->assertNotFound();
});

it('replaces all courses and lessons with the seed data', function () {
    Course::factory()->create();
    Lesson::factory()->create();

    app()->call(ResetDatabaseController::class);

    expect(Course::all()->modelKeys())
        ->toEqualCanonicalizing(['seed-technical', 'seed-pm', 'seed-tech-lead', 'seed-behavioural', 'seed-reverse'])
        ->and(Lesson::count())->toBe(4);
});
