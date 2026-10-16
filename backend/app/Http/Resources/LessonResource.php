<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'courseId' => $this->courseId,
            'title' => $this->title,
            'position' => $this->position,
            'notes' => $this->notes,
            'tags' => $this->tags,
            'items' => $this->items,
            'version' => $this->version,
            'lock' => $this->lock,
            'updatedAt' => $this->updatedAt?->toIso8601ZuluString('millisecond'),
        ];
    }
}
