<?php

namespace App\Http\Requests;

use App\Enums\Track;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Override;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'track' => ['required', Rule::enum(Track::class)],
            'description' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    #[Override]
    public function messages(): array
    {
        return [
            'title.required' => 'Title is required',
            'title.max' => 'Title must be 120 characters or fewer',
            'track.required' => 'Choose a track',
            'track.enum' => 'Choose a track',
        ];
    }
}
