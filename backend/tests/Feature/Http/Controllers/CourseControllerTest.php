<?php

use App\Models\Course;
use MongoDB\BSON\ObjectId;

use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;
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

describe('store', function () {
    it('creates a course with server-owned fields and returns 201', function () {
        travelTo('2026-10-16 10:00:00');

        $response = postJson(route('courses.store'), [
            'title' => '   New course   ',
            'track' => 'pm',
            'description' => '',
            'version' => 99,
            'outline' => [['lessonId' => 'x', 'title' => 'Injected', 'position' => 1]],
        ]);

        $course = Course::sole();
        $response->assertCreated()->assertExactJson([
            'id' => $course->id,
            'title' => 'New course',
            'track' => 'pm',
            'description' => '',
            'outline' => [],
            'version' => 1,
            'updatedAt' => '2026-10-16T10:00:00.000Z',
        ]);
    });

    it('returns 422 with field errors and stores nothing when input is invalid', function () {
        postJson(route('courses.store'), ['title' => '  ', 'track' => 'design'])
            ->assertUnprocessable()
            ->assertExactJson([
                'message' => 'Please fix the highlighted fields',
                'errors' => [
                    'title' => ['Title is required'],
                    'track' => ['Choose a track'],
                ],
            ]);

        expect(Course::count())->toBe(0);
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

describe('update', function () {
    it('changes only sent fields, bumps the version and returns 200', function () {
        travelTo('2026-10-16 10:00:00');
        $course = Course::factory()->create(['title' => 'Old', 'track' => 'pm']);
        travelTo('2026-10-16 11:00:00');

        patchJson(route('courses.update', $course), [
            'title' => '   New   ',
            'description' => '',
            'version' => 1,
            'outline' => [['lessonId' => 'x', 'title' => 'Injected', 'position' => 1]],
        ])
            ->assertOk()
            ->assertExactJson([
                'id' => $course->id,
                'title' => 'New',
                'track' => 'pm',
                'description' => '',
                'outline' => [],
                'version' => 2,
                'updatedAt' => '2026-10-16T11:00:00.000Z',
            ]);
    });

    it('returns 409 with the current course and keeps it when the version is stale', function () {
        $course = Course::factory()->create();

        patchJson(route('courses.update', $course), ['title' => 'Mine', 'version' => 1])->assertOk();

        patchJson(route('courses.update', $course), ['title' => 'Theirs', 'version' => 1])
            ->assertConflict()
            ->assertJsonPath('message', 'This course was changed by someone else')
            ->assertJsonPath('current.title', 'Mine')
            ->assertJsonPath('current.version', 2);

        expect($course->fresh()->title)->toBe('Mine');
    });

    it('returns 422 and keeps the course when the version is missing', function () {
        $course = Course::factory()->create(['title' => 'Old']);

        patchJson(route('courses.update', $course), ['title' => 'New'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['version']);

        expect($course->fresh()->title)->toBe('Old');
    });
});
