<?php

use App\Models\Course;
use App\Models\Lesson;
use MongoDB\BSON\ObjectId;

use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\travelTo;

beforeEach(function () {
    Course::truncate();
    Lesson::truncate();
});

describe('store', function () {
    it('adds the lesson to the end of the outline without bumping the course version', function () {
        travelTo('2026-10-16 10:00:00');
        $course = Course::factory()->create();

        postJson("/api/courses/{$course->id}/lessons", ['title' => '  First  '])->assertCreated();
        $response = postJson(route('courses.lessons.store', $course), [
            'title' => 'Second',
            'notes' => 'Injected',
            'position' => 9,
        ]);

        [$first, $second] = Lesson::orderBy('_id')->get()->all();
        $response->assertCreated()->assertExactJson([
            'id' => $second->id,
            'courseId' => $course->id,
            'title' => 'Second',
            'position' => 1,
            'notes' => '',
            'tags' => [],
            'items' => [],
            'version' => 1,
            'lock' => null,
            'updatedAt' => '2026-10-16T10:00:00.000Z',
        ]);

        $course->refresh();
        expect($course->outline)->toEqual([
            ['lessonId' => $first->id, 'title' => 'First', 'position' => 0],
            ['lessonId' => $second->id, 'title' => 'Second', 'position' => 1],
        ])->and($course->version)->toBe(1);
    });

    it('returns 404 and stores nothing when the course does not exist', function () {
        postJson('/api/courses/'.new ObjectId.'/lessons', ['title' => 'Orphan'])
            ->assertNotFound()
            ->assertExactJson(['message' => 'Course not found']);

        expect(Lesson::count())->toBe(0);
    });

    it('returns 422 and leaves the outline empty when the title is blank', function () {
        $course = Course::factory()->create();

        postJson(route('courses.lessons.store', $course), ['title' => '   '])
            ->assertUnprocessable()
            ->assertExactJson([
                'message' => 'Please fix the highlighted fields',
                'errors' => ['title' => ['Title is required']],
            ]);

        expect(Lesson::count())->toBe(0)
            ->and($course->fresh()->outline)->toBe([]);
    });
});

describe('show', function () {
    it('returns one lesson by id', function () {
        Lesson::factory()->create();
        $lesson = Lesson::factory()->create(['title' => 'Target']);

        getJson('/api/lessons/'.$lesson->id)
            ->assertOk()
            ->assertJsonPath('id', $lesson->id)
            ->assertJsonPath('title', 'Target');
    });

    it('returns 404 with the contract message when the lesson does not exist', function () {
        getJson(route('lessons.show', (string) new ObjectId))
            ->assertNotFound()
            ->assertExactJson(['message' => 'Lesson not found']);
    });
});
