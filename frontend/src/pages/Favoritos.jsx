import { useFavoritos } from '../hooks/favoritos/useFavoritos';
import PublicacionCard from '../components/PublicacionCard';

export default function Favoritos() {
  const { favoritos, handleAgregarFavorito, handleEliminarFavorito } = useFavoritos();

  return (
    <div className="contenedor-favoritos">
      {favoritos.map((fav) => (
        <PublicacionCard 
          key={fav.id} 
          publicacion={fav.publicacion} 
          favoritos={favoritos}
          handleAgregarFavorito={handleAgregarFavorito}
          handleEliminarFavorito={handleEliminarFavorito}
        />
      ))}
    </div>
  );
}