import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Project from './pages/Project'
import Members from './pages/Members'
import News from './pages/News'
import NewsArticle from './pages/NewsArticle'
import LesHouches from './pages/event/LesHouches'

function App() {
  const location = useLocation()
  const isEventPage = location.pathname.startsWith('/events/')

  if (isEventPage) {
    return (
      <Routes>
        <Route path="/events/les-houches-2026" element={<LesHouches />} />
      </Routes>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project" element={<Project />} />
          <Route path="/member-institutions-and-pis" element={<Members />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
        </Routes>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default App
