import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)

  const changeLanguage = async (lng) => {
    try {
      await i18n.changeLanguage(lng)
      localStorage.setItem('language', lng)
      setIsOpen(false) // Close dropdown after selection
      
      // Optional: Save to user profile in database
      // const token = localStorage.getItem('token')
      // await fetch('/api/user/language', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ language: lng })
      // })
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.language-switcher')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative language-switcher">
      {/* Trigger Button - Mobile friendly with click */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Globe size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden lg:inline text-sm font-medium">{currentLanguage.name}</span>
        <svg 
          className={`w-4 h-4 hidden md:block transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu - Shows on click for mobile */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
              i18n.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {i18n.language === lang.code && (
              <svg className="w-5 h-5 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
      )}
    </div>
  )
}
