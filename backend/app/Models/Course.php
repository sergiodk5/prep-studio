<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use MongoDB\Laravel\Eloquent\Model;

#[Connection('mongodb')]
#[Fillable(['title', 'track', 'description'])]
class Course extends Model
{
    const CREATED_AT = null;

    const UPDATED_AT = 'updatedAt';

    protected $attributes = [
        'description' => '',
        'outline' => [],
        'version' => 1,
    ];
}
