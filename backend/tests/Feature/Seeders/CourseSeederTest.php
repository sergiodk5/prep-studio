<?php

use App\Models\Course;
use App\Models\Lesson;
use Database\Seeders\CourseSeeder;

use function Pest\Laravel\getJson;
use function Pest\Laravel\seed;

beforeEach(function () {
    Course::truncate();
    Lesson::truncate();
});

it('resets the seed courses on every run without touching other courses', function () {
    $own = Course::factory()->create();

    seed(CourseSeeder::class);
    seed(CourseSeeder::class);

    expect(Course::count())->toBe(6)
        ->and(Course::find($own->id))->not->toBeNull()
        ->and(Lesson::count())->toBe(4);
});

it('serves the seeded technical course with an outline that points at its lessons', function () {
    seed(CourseSeeder::class);

    getJson('/api/courses/seed-technical')
        ->assertOk()
        ->assertJsonPath('updatedAt', '2026-10-12T00:00:00.000Z')
        ->assertJsonPath('outline.0', ['lessonId' => 'seed-technical-lesson-1', 'title' => 'Vue state and stores', 'position' => 0])
        ->assertJsonCount(4, 'outline');

    getJson('/api/lessons/seed-technical-lesson-4')
        ->assertOk()
        ->assertJsonPath('courseId', 'seed-technical')
        ->assertJsonPath('position', 3);
});
