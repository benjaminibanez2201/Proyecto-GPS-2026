import { useEffect, useState } from 'react';
import { Star, CheckCircle, Clock } from 'lucide-react'; // Iconos limpios de Lucide
import { listarArriendos, confirmarArriendo, crearResena } from '../services/rentalsAndReviews.service.js';

export default function HistorialArriendos() {
  const [arriendos, setArriendos] = useState([]);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [arriendoSeleccionado, setArriendoSeleccionado] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const usuarioLogueadoId = 2; 

  const colores = {
    principal: '#008080',   
    secundario: '#e6dfd3',  
    textoOscuro: '#2c3e50',
    blanco: '#ffffff',
    oro: '#ffd21f' 
  };

  const cargarDatos = async () => {
    const [data, err] = await listarArriendos();
    if (err) setError(err);
    else setArriendos(data);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleConfirmar = async (id) => {
    const [data, err] = await confirmarArriendo(id);
    if (err) alert(err);
    else {
      alert("Confirmacion registrada con exito");
      cargarDatos();
    }
  };

  const abrirModalCalificar = (arriendo) => {
    setArriendoSeleccionado(arriendo);
    setModalAbierto(true);
  };

  const handleEnviarCalificacion = async (e) => {
    e.preventDefault();
    
    const targetUserId = usuarioLogueadoId === arriendoSeleccionado.arrendadorId 
      ? arriendoSeleccionado.estudianteId 
      : arriendoSeleccionado.arrendadorId;

    const payload = {
      rentalId: arriendoSeleccionado.id,
      targetUserId,
      rating,
      comment
    };

    const [data, err] = await crearResena(payload);
    if (err) alert(err);
    else {
      alert("Calificacion enviada exitosamente");
      setModalAbierto(false);
      setComment('');
      setRating(5);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f9f8f6', minHeight: '100vh' }}>
      <h2 style={{ color: colores.textoOscuro, borderBottom: `3px solid ${colores.principal}`, paddingBottom: '10px' }}>
        Historial de Arriendos Concretados
      </h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <table border="0" cellPadding="15" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: colores.blanco, borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: colores.secundario, color: colores.textoOscuro }}>
            <th>ID</th>
            <th>Rol Contratante</th>
            <th>Estado Interno</th>
            <th>Acciones de Confirmación</th>
            <th>Evaluación Mutua</th>
          </tr>
        </thead>
        <tbody>
          {arriendos.map((item) => {
            const soyArrendador = usuarioLogueadoId === item.arrendadorId;
            const yaConfirme = soyArrendador ? item.confirmedByArrendador : item.confirmedByEstudiante;

            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{item.id}</td>
                <td>{soyArrendador ? 'Arrendador' : 'Estudiante'}</td>
                <td>
                  <span style={{ 
                    backgroundColor: item.status === 'COMPLETED' ? '#d4edda' : '#fff3cd', 
                    color: item.status === 'COMPLETED' ? '#155724' : '#856404',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === 'COMPLETED' ? (
                    <span style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle size={16} /> Arriendo Concretado
                    </span>
                  ) : yaConfirme ? (
                    <span style={{ color: '#ffc107', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={16} /> Esperando otra parte
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleConfirmar(item.id)}
                      style={{ backgroundColor: colores.principal, color: colores.blanco, border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Confirmar arriendo
                    </button>
                  )}
                </td>
                <td>
                  {item.status === 'COMPLETED' ? (
                    <button 
                      onClick={() => abrirModalCalificar(item)} 
                      style={{ backgroundColor: '#ffc107', color: colores.textoOscuro, border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Star size={16} fill={colores.textoOscuro} /> Calificar Contraparte
                    </button>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>Faltan confirmaciones</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* MODAL DE CALIFICACIÓN */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: colores.textoOscuro }}>Enviar Calificación</h3>
            <form onSubmit={handleEnviarCalificacion}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Puntuación:</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: '100%', padding: '8px', margin: '0 0 15px 0', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="5">5 Estrellas</option>
                <option value="4">4 Estrellas</option>
                <option value="3">3 Estrellas</option>
                <option value="2">2 Estrellas</option>
                <option value="1">1 Estrella</option>
              </select>

              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Comentario (Opcional):</label>
              <textarea 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                maxLength={1000} 
                rows="4" 
                placeholder="Escribe una reseña honesta..."
                style={{ width: '100%', padding: '8px', margin: '0 0 15px 0', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ backgroundColor: '#ccc', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: colores.principal, color: colores.blanco, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar Calificación</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}