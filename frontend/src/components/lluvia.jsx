function Lluvia({lluviaBool, lluviaMm}) {

    return(
        <div className="sensor-card">
            <h1>Lluvia: {lluviaBool ? 'Lloviendo' : 'No llueve'}</h1>
            <h1>{lluviaMm} mm</h1>
        </div>
    )
}
export default Lluvia;