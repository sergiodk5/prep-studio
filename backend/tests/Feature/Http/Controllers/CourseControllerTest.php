<?php

use App\Models\Course;

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
