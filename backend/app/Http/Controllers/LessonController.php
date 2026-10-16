<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;

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

    public function update(Request $request, Lesson $lesson)
    {
        //
    }

    public function destroy(Lesson $lesson)
    {
        //
    }
}
