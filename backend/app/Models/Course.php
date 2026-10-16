<?php

namespace App\Models;

use Database\Factories\CourseFactory;
use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

#[Connection('mongodb')]
#[Fillable(['title', 'track', 'description'])]
class Course extends Model
{
    /** @use HasFactory<CourseFactory> */
    use HasFactory;

    const CREATED_AT = null;

    const UPDATED_AT = 'updatedAt';

    protected $attributes = [
        'description' => '',
        'outline' => [],
        'version' => 1,
    ];
}
