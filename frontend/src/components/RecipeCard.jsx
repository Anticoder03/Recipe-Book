import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Users } from 'lucide-react'
import { formatDate } from '../utils/errors'

export default function RecipeCard({ recipe }) {
  return (
    <article className="rb-recipe-card">
      <div className="rb-recipe-card__meta">
        <span>
          <Users size={14} aria-hidden="true" />
          {recipe.servings} servings
        </span>
        <span>
          <Clock size={14} aria-hidden="true" />
          {formatDate(recipe.createdAt)}
        </span>
      </div>

      <h3 className="rb-recipe-card__title">
        <Link to={`/recipes/${recipe._id}`}>{recipe.title}</Link>
      </h3>
      <p className="rb-recipe-card__description">{recipe.description}</p>

      {recipe.tags?.length > 0 && (
        <ul className="rb-tags" aria-label="Tags">
          {recipe.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      <Link className="rb-recipe-card__link" to={`/recipes/${recipe._id}`}>
        Read the recipe
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </article>
  )
}
