<?php

namespace App\Http\Controllers;

use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CourseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return CourseResource::collection(Course::orderBy('_id')->get());
    }

    public function store(Request $request)
    {
        //
    }

    public function show(Course $course): CourseResource
    {
        return new CourseResource($course);
    }

    public function update(Request $request, Course $course)
    {
        //
    }

    public function destroy(Course $course)
    {
        //
    }
}
