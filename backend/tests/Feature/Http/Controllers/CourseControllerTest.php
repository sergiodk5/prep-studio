<?php

use App\Models\Course;
use MongoDB\BSON\ObjectId;

use function Pest\Laravel\getJson;
use function Pest\Laravel\travelTo;

beforeEach(function () {
    Course::truncate();
});

describe('index', function () {
    it('returns courses as a plain array in creation order', function () {
        travelTo('2026-10-16 10:00:00');
        $first = Course::factory()->create(['title' => 'First']);
        $second = Course::factory()->create(['title' => 'Second']);

        getJson(route('courses.index'))
            ->assertOk()
            ->assertExactJson([
                [
                    'id' => $first->id,
                    'title' => 'First',
                    'track' => $first->track,
                    'description' => $first->description,
                    'outline' => [],
                    'version' => 1,
                    'updatedAt' => '2026-10-16T10:00:00.000Z',
                ],
                [
                    'id' => $second->id,
                    'title' => 'Second',
                    'track' => $second->track,
                    'description' => $second->description,
                    'outline' => [],
                    'version' => 1,
                    'updatedAt' => '2026-10-16T10:00:00.000Z',
                ],
            ]);
    });
});

describe('show', function () {
    it('returns one course by id', function () {
        travelTo('2026-10-16 10:00:00');
        Course::factory()->create();
        $course = Course::factory()->create(['title' => 'Target']);

        getJson(route('courses.show', $course))
            ->assertOk()
            ->assertExactJson([
                'id' => $course->id,
                'title' => 'Target',
                'track' => $course->track,
                'description' => $course->description,
                'outline' => [],
                'version' => 1,
                'updatedAt' => '2026-10-16T10:00:00.000Z',
            ]);

    });

    it('returns 404 with the contract message when the course does not exist', function () {
        getJson(route('courses.show', (string) new ObjectId))
            ->assertNotFound()
            ->assertExactJson(['message' => 'Course not found']);
    });
});
