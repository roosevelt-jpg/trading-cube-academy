'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Lesson } from '@/lib/types/database'

type LessonSidebarProps = {
  courseSlug: string
  moduleSlug: string
  moduleTitle: string
  lessons: Lesson[]
  currentLessonId: string
  completedMap: Record<string, boolean>
}

export function LessonSidebar({
  courseSlug,
  moduleSlug,
  moduleTitle,
  lessons,
  currentLessonId,
  completedMap,
}: LessonSidebarProps) {
  const contentLessons = lessons.filter((l) => l.lesson_type !== 'quiz')
  const completedCount = contentLessons.filter((l) => completedMap[l.id]).length

  return (
    <aside className="lesson-sidebar">
      <p className="mono muted mb-1 text-[10px] uppercase tracking-widest">Module</p>
      <p className="h2 mb-4 text-sm leading-snug">{moduleTitle}</p>
      <p className="mono muted mb-4 text-[11px]">
        {completedCount} of {contentLessons.length} lessons
      </p>
      <nav className="lesson-sidebar-nav">
        {lessons.map((lesson, i) => {
          const done = completedMap[lesson.id]
          const isCurrent = lesson.id === currentLessonId
          const prevDone = i === 0 || completedMap[lessons[i - 1].id]
          const locked = !prevDone && lesson.lesson_type !== 'quiz' && !isCurrent
          const href =
            lesson.lesson_type === 'quiz'
              ? `/student/courses/${courseSlug}/modules/${moduleSlug}/quiz`
              : `/student/courses/${courseSlug}/lessons/${lesson.slug}`

          const row = (
            <div
              className={cn(
                'lesson-sidebar-item',
                isCurrent && 'current',
                done && 'done',
                locked && 'locked',
              )}
            >
              <span className="lesson-sidebar-icon">{done ? '✓' : locked ? '🔒' : isCurrent ? '▶' : '○'}</span>
              <span className="truncate text-[13px]">{lesson.title}</span>
            </div>
          )

          if (locked) return <div key={lesson.id}>{row}</div>
          return (
            <Link key={lesson.id} href={href}>
              {row}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
