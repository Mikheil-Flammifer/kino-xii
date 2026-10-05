import homeText from '../../data/home.json'

export default function Hero() {
  return (
    <section className="hero">
      <div>
        <span>{homeText.hero.badge}</span>

        <h1>{homeText.hero.title}</h1>

        <div>
          <span>{homeText.hero.age}</span>
          <span>{homeText.hero.duration}</span>
          <span>{homeText.hero.format}</span>
          <span>{homeText.hero.language}</span>
        </div>

        <p>{homeText.hero.description}</p>

        <button>
          {homeText.hero.buyTicket}
        </button>

        <button>
          {homeText.hero.watchTrailer}
        </button>
      </div>
    </section>
  )
}