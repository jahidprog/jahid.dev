import About from './components/About'
import Activities from './components/Activities'
import Education from './components/Education'
import Experience from './components/Experience'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import Projects from './components/Projects'
import SEOHead from './components/SEOHead'
import Thesis from './components/Thesis'
import IntroVideo from './components/IntroVideo'
import IntroModal from './components/IntroModal'
import { SiteThemeProvider } from './components/useSiteTheme.jsx'

function App() {
  return (
    <SiteThemeProvider>
      <IntroModal />
      <SEOHead />
      <Header />
      <Hero />
      <IntroVideo />
      <About />
      <Projects />
      <Thesis />
      <Experience />
      <Education />
      <Activities />
      <Footer />
    </SiteThemeProvider>
  )
}

export default App
