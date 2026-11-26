import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, Users } from 'lucide-react'
import client from '../api/client'
import RecipeCard from '../components/RecipeCard'

export default function HomePage() {
  const [recipes, setRecipes] = useState([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    client
      .get('/recipes')
      .then(({ data }) => {
        if (active) setRecipes(data.recipes)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="rb-home">
      <section className="rb-hero">
        <div className="rb-hero__copy">
          <h1>Cook it once. Find it forever.</h1>
          <p>
            A notebook for the recipes you actually make. Keep the ingredient lists, the
            timings, and the little notes that turn a good dish into your dish.
          </p>
          <div className="rb-hero__actions">
            <Link to="/recipes" className="rb-button rb-button--primary">
              Browse the collection
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/recipes/new" className="rb-button rb-button--quiet">
              Add a recipe
            </Link>
          </div>
        </div>

        <div className="rb-hero__visual">
          <article className="rb-notebook-card" aria-label="Example recipe page">
            <div className="rb-notebook-card__head">
              <span>Sunday tomato pasta</span>
              <span className="rb-notebook-card__stamp">keeper</span>
            </div>
            <p className="rb-notebook-card__intro">
              The tomatoes should collapse into a loose sauce. Do not rush that part.
            </p>
            <div className="rb-notebook-card__grid">
              <div>
                <h2>What you need</h2>
                <ul className="rb-check-list">
                  <li><Check size={14} aria-hidden="true" />200 g pasta</li>
                  <li><Check size={14} aria-hidden="true" />2 ripe tomatoes</li>
                  <li><Check size={14} aria-hidden="true" />A generous handful of basil</li>
                </ul>
              </div>
              <div>
                <h2>How to make it</h2>
                <ol className="rb-step-list rb-step-list--compact">
                  <li>Boil the pasta until just before tender.</li>
                  <li>Cook the tomatoes low and slow.</li>
                  <li>Toss together with basil and serve.</li>
                </ol>
              </div>
            </div>
            <p className="rb-margin-note">More basil next time.</p>
            <div className="rb-notebook-card__footer">
              <span><Users size={14} aria-hidden="true" />2 servings</span>
              <span><Clock size={14} aria-hidden="true" />25 minutes</span>
            </div>
          </article>
        </div>
      </section>

      <section className="rb-section" aria-labelledby="rb-recent-title">
        <div className="rb-section__head">
          <h2 className="rb-section__title" id="rb-recent-title">Recently added</h2>
          <p className="rb-section__intro">
            The newest entries in your notebook, ready to cook again.
          </p>
        </div>

        {failed && (
          <p className="rb-empty" role="alert">
            The kitchen notebook is unavailable right now. Check that the API is running, then
            refresh the page.
          </p>
        )}

        {!failed && recipes.length === 0 && (
          <div className="rb-empty">
            <p>No recipes yet.</p>
            <Link to="/recipes/new" className="rb-button rb-button--primary">
              Add the first recipe
            </Link>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="rb-recipe-grid">
            {recipes.slice(0, 3).map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
