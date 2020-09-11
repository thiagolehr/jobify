const express = require('express')
//express trabalha com o req e res
const app = express()
//cria uma função express
const bodyParser = require('body-parser')

const path = require('path');
const sqlite = require('sqlite');
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), {
  Promise
});

const port = process.env.PORT || 3000

/*TESTAR PARA VERSÃO MAIS NOVA:

client.setProvider(
    sqlite.open( { filename: path.join(__dirname, "settings.sqlite3") } ).then( db => new Commando.SQLiteProvider(db) )
).catch(console.error);

*/

/******************Outra maneira! ************

Firstly install better-sqlite3 using npm npm i better-sqlite3 (this may take one or two minutes to install)
Then simply copy and paste this code into your project (index.js):

const database = require('better-sqlite3')
const db = new database('settings.db')

client.setProvider(
    new commando.SyncSQLiteProvider(db)
)
*/
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
    const db = await dbConnection
    const categoriasDb = await db.all('select * from categorias;')
    const vagas = await db.all('select * from vagas')
    const categorias = categoriasDb.map(cat =>{ //cat = categoria
        return {
            ...cat, //spread operator -> pega cada item dentro da categoria e
            //espalhar pra um objeto
            vagas: vagas.filter( vaga => vaga.categoria === cat.id)
        }
    })
    res.render('index', {
        categorias
    })
})
//fica no aguardo até chegar o "/"
//callback (chama depois que receber a requisição)
//p. ex. F5 do navegador na página
app.get('/vaga/:id', async (req, res) => {
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = '+req.params.id)
    // console.log(vaga)
    res.render('vaga', {
        vaga
    })
})

const init = async () => {
    const db = await dbConnection;
    await db.run(
      `create table if not exists categorias (
        id INTEGER PRIMARY KEY, categoria TEXT
        )`
    )

    await db.run(
        `create table if not exists vagas (
          id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT
          )`
      )
    // const vaga = 'Social Media'
    
    
}

app.get('/admin', (req, res) => {
    res.render('admin/home')
})
app.get('/admin/vagas', async(req, res) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas')
    res.render('admin/vagas', { vagas })
})
app.get('/admin/vagas/delete/:id', async(req,res) => {
    const db = await dbConnection
    await db.run('delete from vagas where id = ' +req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async(req, res) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/nova-vaga', { categorias })
})

app.get('/admin/vagas/editar/:id', async(req, res) =>{
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id = '+req.params.id)
    res.render('admin/editar-vaga', { categorias, vaga })
})

app.post('/admin/vagas/editar/:id', async(req, res) =>{   
    const { titulo, descricao, categoria} = req.body
    const { id } = req.params
    const db = await dbConnection
    await db.run(`update vagas set categoria='${categoria}', titulo='${titulo}', descricao='${descricao}' where id = ${id}`)
    res.redirect('/admin/vagas')
})


app.post('/admin/vagas/nova', async(req, res) =>{   
    const { titulo, descricao, categoria} = req.body
    const db = await dbConnection
    await db.run(`insert into vagas(categoria, titulo, descricao) values('${categoria}', '${titulo}', '${descricao}')`)
    res.redirect('/admin/vagas')
})


init()


app.listen(port, (err) =>{
    if(err){
        console.log('Não foi possível iniciar o servidor do Jobify')
    }else{
        console.log('Servidor do Jobify rodando...')
    }
})

  