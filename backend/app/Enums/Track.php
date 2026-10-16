<?php

namespace App\Enums;

enum Track: string
{
    case Technical = 'technical';
    case Pm = 'pm';
    case TechLead = 'tech-lead';
    case Behavioural = 'behavioural';
    case Reverse = 'reverse';
}
