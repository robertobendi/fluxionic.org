import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Project from './pages/Project'
import Members from './pages/Members'
import NodeDetail from './pages/NodeDetail'
import News from './pages/News'
import NewsArticle from './pages/NewsArticle'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Conferences from './pages/Conferences'
import ConferenceDetail from './pages/ConferenceDetail'
import Publications from './pages/Publications'
import Outreach from './pages/Outreach'

function App() {
  const location = useLocation()

  useEffect(() => {
    fetch('/api/metrics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: location.pathname,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {})
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project" element={<Project />} />
          <Route path="/member-institutions-and-pis" element={<Members />} />
          <Route path="/nodes/:node" element={<NodeDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/conferences" element={<Conferences />} />
          <Route path="/conferences/:slug" element={<ConferenceDetail />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/outreach" element={<Outreach />} />
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
