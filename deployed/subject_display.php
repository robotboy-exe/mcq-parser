<?php
declare(strict_types=1);

const CBT_ENGLISH_LEXIS_SUBJECT_NAME = 'English (Lexis & Structure)';
const CBT_ENGLISH_LEXIS_DISPLAY_NAME = 'English (Comprehension Pages / Lexis & Structure)';

function cbt_subject_display_name(string $subjectName): string
{
    return $subjectName === CBT_ENGLISH_LEXIS_SUBJECT_NAME
        ? CBT_ENGLISH_LEXIS_DISPLAY_NAME
        : $subjectName;
}
