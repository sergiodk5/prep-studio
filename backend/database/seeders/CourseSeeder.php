<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CourseSeeder extends Seeder
{
    private const SEEDED_AT = '2026-10-12 00:00:00';

    /**
     * @var list<array{track: string, title: string, description: string, lessons: list<string>}>
     */
    private const COURSES = [
        [
            'track' => 'technical',
            'title' => 'Technical screen',
            'description' => 'The JobMojito questions: Vue state, performance, MongoDB, PHP.',
            'lessons' => ['Vue state and stores', 'Rendering performance', 'MongoDB data modelling', 'PHP and Laravel'],
        ],
        [
            'track' => 'pm',
            'title' => 'Product manager round',
            'description' => 'Product thinking, trade-offs and working with PMs.',
            'lessons' => [],
        ],
        [
            'track' => 'tech-lead',
            'title' => 'Tech lead round',
            'description' => 'Architecture, testing strategy, legacy code and leading a team.',
            'lessons' => [],
        ],
        [
            'track' => 'behavioural',
            'title' => 'Behavioural stories',
            'description' => 'STAR stories, under two minutes each.',
            'lessons' => [],
        ],
        [
            'track' => 'reverse',
            'title' => 'Questions to ask them',
            'description' => 'What I want to learn about the team and the role.',
            'lessons' => [],
        ],
    ];

    public function run(): void
    {
        $courseIds = array_map(fn (array $course) => "seed-{$course['track']}", self::COURSES);

        Course::whereIn('_id', $courseIds)->delete();
        Lesson::whereIn('courseId', $courseIds)->delete();

        Model::withoutTimestampsOn([Course::class, Lesson::class], function () {
            foreach (self::COURSES as $course) {
                $this->seedCourse($course);
            }
        });
    }

    /**
     * @param  array{track: string, title: string, description: string, lessons: list<string>}  $course
     */
    private function seedCourse(array $course): void
    {
        $courseId = "seed-{$course['track']}";
        $seededAt = Carbon::parse(self::SEEDED_AT);
        $outline = [];

        foreach ($course['lessons'] as $position => $title) {
            $lessonId = "{$courseId}-lesson-".($position + 1);

            Lesson::forceCreate([
                '_id' => $lessonId,
                'courseId' => $courseId,
                'title' => $title,
                'position' => $position,
                'updatedAt' => $seededAt,
            ]);

            $outline[] = ['lessonId' => $lessonId, 'title' => $title, 'position' => $position];
        }

        Course::forceCreate([
            '_id' => $courseId,
            'title' => $course['title'],
            'track' => $course['track'],
            'description' => $course['description'],
            'outline' => $outline,
            'updatedAt' => $seededAt,
        ]);
    }
}
