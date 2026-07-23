function Lluvia({lluviaBool, lluviaMm}) {

    return(
        <div>
        <h1>LLuvia: {lluviaBool ? 'Lloviendo' : 'No llueve'}</h1>
        <h1>{lluviaMm} mm</h1>
        </div>
    )
}
export default Lluvia;