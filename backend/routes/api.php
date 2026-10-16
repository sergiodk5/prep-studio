<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\LessonController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('courses', CourseController::class)
    ->missing(fn () => response()->json(['message' => 'Course not found'], 404));

Route::post('courses/{course}/lessons', [LessonController::class, 'store'])
    ->name('courses.lessons.store')
    ->missing(fn () => response()->json(['message' => 'Course not found'], 404));

Route::apiResource('lessons', LessonController::class)
    ->only(['show', 'update'])
    ->missing(fn () => response()->json(['message' => 'Lesson not found'], 404));
