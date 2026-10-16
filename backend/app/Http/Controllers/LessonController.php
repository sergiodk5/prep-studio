<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;

class LessonController extends Controller
{
    public function store(StoreLessonRequest $request, Course $course): LessonResource
    {
        $lesson = new Lesson($request->validated());
        $lesson->courseId = $course->id;
        $lesson->position = count($course->outline);
        $lesson->save();

        $course->push('outline', [[
            'lessonId' => $lesson->id,
            'title' => $lesson->title,
            'position' => $lesson->position,
        ]]);

        return new LessonResource($lesson);
    }

    public function show(Lesson $lesson): LessonResource
    {
        return new LessonResource($lesson);
    }

    public function update(UpdateLessonRequest $request, Lesson $lesson): LessonResource|JsonResponse
    {
        $changes = $request->safe()->except('version');

        if (array_key_exists('notes', $changes)) {
            $changes['notes'] ??= '';
        }

        $updated = Lesson::where('_id', $lesson->id)
            ->where('version', $request->validated('version'))
            ->increment('version', 1, $changes);

        $lesson->refresh();

        if ($updated === 0) {
            return response()->json([
                'message' => 'This lesson was changed by someone else',
                'current' => new LessonResource($lesson),
            ], 409);
        }

        if (array_key_exists('title', $changes)) {
            Course::where('_id', $lesson->courseId)
                ->where('outline.lessonId', $lesson->id)
                ->toBase()
                ->update(['outline.$.title' => $lesson->title]);
        }

        return new LessonResource($lesson);
    }

    public function destroy(Lesson $lesson)
    {
        //
    }
}
