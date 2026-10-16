<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CourseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CourseResource::collection(Course::orderBy('_id')->get());
    }

    public function store(StoreCourseRequest $request): CourseResource
    {
        $course = Course::create([
            ...$request->validated(),
            'description' => $request->validated('description') ?? '',
        ]);

        return new CourseResource($course);
    }

    public function show(Course $course): CourseResource
    {
        return new CourseResource($course);
    }

    public function update(UpdateCourseRequest $request, Course $course): CourseResource|JsonResponse
    {
        $changes = $request->safe()->except('version');

        if (array_key_exists('description', $changes)) {
            $changes['description'] ??= '';
        }

        $updated = Course::where('_id', $course->id)
            ->where('version', $request->validated('version'))
            ->increment('version', 1, $changes);

        $course->refresh();

        if ($updated === 0) {
            return response()->json([
                'message' => 'This course was changed by someone else',
                'current' => new CourseResource($course),
            ], 409);
        }

        return new CourseResource($course);
    }

    public function destroy(Course $course)
    {
        //
    }
}
