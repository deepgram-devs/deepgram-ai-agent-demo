// help, taken from,
// https://github.com/vercel/ai-chatbot/blob/fa9f0947f0a7983cf5022cbbc1416910349dd5e4/lib/hooks/use-enter-submit.tsx
import { useRef, type RefObject } from 'react'

export function useSubmit(): {
  formRef: RefObject<HTMLFormElement>
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
} {
  const formRef = useRef<HTMLFormElement>(null)

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.key === 'Enter'
    ) {
      formRef.current?.requestSubmit()
      event.preventDefault()
    }
  }

  return { formRef, onKeyDown: handleKeyDown }
}