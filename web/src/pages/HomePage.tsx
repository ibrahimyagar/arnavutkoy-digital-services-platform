import { Link } from 'react-router-dom'
import './home.css'

export function HomePage() {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden />
        <div className="container home-hero-copy">
          <p className="home-kicker">Örnek dijital hizmetler platformu</p>
          <h1>Arnavutköy</h1>
          <p className="home-lead">
            Belediye hizmetlerine tek yerden ulaşın: borç ödeme, hizmet talebi ve ulaşım kartı.
          </p>
          <div className="home-cta">
            <Link className="btn btn-primary" to="/giris">
              Vatandaş girişi
            </Link>
            <Link className="btn btn-ghost" to="/duyurular">
              Duyuruları gör
            </Link>
          </div>
        </div>
      </section>

      <section className="container home-strip">
        <article>
          <h2>Şeffaf borçlar</h2>
          <p className="muted">Su ve emlak borçlarınızı gecikme faiziyle birlikte görün.</p>
        </article>
        <article>
          <h2>Hizmet masası</h2>
          <p className="muted">Talebinizi açın, durumunu takip edin, mesajlaşın.</p>
        </article>
        <article>
          <h2>Ulaşım kartı</h2>
          <p className="muted">Bakiye yükleyin, hatlara binin, geçmişi izleyin.</p>
        </article>
      </section>
    </div>
  )
}
