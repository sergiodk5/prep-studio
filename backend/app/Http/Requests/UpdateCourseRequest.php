<?php

namespace App\Http\Requests;

use App\Enums\Track;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends StoreCourseRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:120'],
            'track' => ['sometimes', 'required', Rule::enum(Track::class)],
            'description' => ['sometimes', 'nullable', 'string'],
            'version' => ['required', 'integer'],
        ];
    }
}
