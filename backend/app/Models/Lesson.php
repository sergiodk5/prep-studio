<?php

namespace App\Models;

use Database\Factories\LessonFactory;
use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

#[Connection('mongodb')]
#[Fillable(['title', 'notes', 'tags', 'items'])]
class Lesson extends Model
{
    /** @use HasFactory<LessonFactory> */
    use HasFactory;

    const CREATED_AT = null;

    const UPDATED_AT = 'updatedAt';

    protected $attributes = [
        'notes' => '',
        'tags' => [],
        'items' => [],
        'version' => 1,
        'lock' => null,
    ];
}
