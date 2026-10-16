<?php

namespace App\Http\Controllers\Testing;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Database\Seeders\CourseSeeder;
use Illuminate\Http\Response;

class ResetDatabaseController extends Controller
{
    public function __invoke(CourseSeeder $seeder): Response
    {
        Course::truncate();
        Lesson::truncate();
        $seeder->run();

        return response()->noContent();
    }
}
