

const Sequelize = require('sequelize');


const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");


exports.helpCmd = (socket, rl) => {
		log(socket, "Comandos:");
		log(socket, "	h|help - Muestra esta ayuda.");
		log(socket, "	list - Listar los quizzes existentes.");
		log(socket, "	show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
		log(socket, "	add - Añadir un nuevo quiz interactivamente.");
		log(socket, "	delete <id> - Borrar el quiz indicado.");
		log(socket, "	edit <id> - Editar el quiz indicado.");
		log(socket, "	test <id> - Probar el quiz indicado.");
		log(socket, "	p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
		log(socket, "	credits - Créditos.");
		log(socket, "	q|quit - Salir del programa.");
		rl.prompt();
};

exports.quitCmd = (socket, rl) => {
	rl.close();
	socket.end();
};



const makeQuestion = (rl, text) => {
  return new Sequelize.Promise ((resolve,reject) => {
    rl.question(colorize(text, 'red'), answer =>{
    resolve(answer.trim());
    });
  });
};



exports.addCmd = (socket, rl) => {

  makeQuestion(rl, 'Pregunta')
  .then(q => {
    return makeQuestion(rl, 'Respuesta')
    .then(a => {
      return {question: q, answer:a};
    });
  })
.then(quiz=>{
    return models.quiz.create(quiz);
})
.then((quiz) => {
    log(socket, `${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize(' => ','magenta')} ${quiz.answer}`);
})
.catch(Sequelize.ValidationError, error => {
  errorlog (socket, 'El quiz es erroneo:');
  error.errors.forEach(({message}) => errorlog(socket, message));
})
.catch(error => {
  errorlog(socket, error.message); 
})
.then(() => {
  rl.prompt();
});

};






const validateId = id =>{

  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined"){
      reject(new Error(`Falta el parametro <id>.`));
    }else{
      id=parseInt(id);
      if(Number.isNaN(id)){
        reject(new Error(`El valor del parametro <id> no es un numero.`));
      }else{
        resolve(id);
      }
    }
  });
};





exports.showCmd = (socket, rl,id) => {

  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error (` No existe un quiz asociado al id=${id}.`);
    }
    log(socket, `  [${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

exports.listCmd = (socket, rl) => {

  models.quiz.findAll()
  .each(quiz => {
        log(socket, `[${colorize(quiz.id, 'magenta')}]:  ¿${quiz.question}?`);
  })
  .catch(error =>{
    errorlog(socket,  error.message);
  })
  .then(()=>{
    rl.prompt();
  });






};


exports.deleteCmd = (socket, rl,id) => {
validateId(id)
.then(id => models.quiz.destroy({where: {id}}))
.catch(error => {
  errorlog(socket, error.message);
})
.then(() => {
  rl.prompt();
});
};


/*exports.testCmd = (rl, id) => {
  validateId(id)
    .then(id => { models.quiz.findById(id))
      .then(quiz => {
          if(!quiz){
                throw new Error(`No existe el parametro asociado ${id}.`);
          }
          log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question}`);

        rl.question(colorize('Introduzca una respuesta: ', 'red'), respuesta =>{

        if(String(respuesta.trim().toLowerCase()) === String(quiz.answer.toLowerCase())){
          log('Su respuesta es correcta ');
          //biglog('Correcta','green');
        } 
        else{
          log('Su respuesta es incorrecta');
          //biglog('Incorrecta', 'red');
        }
        rl.prompt();
      });
  });
}*/

        /*  
        if(String(rl.trim().toLowerCase()) === String(quiz.answer.toLowerCase())){
            log('Su respuesta es correcta: ');
            //biglog('Correcta','green');
          } else {
            log('Su respuesta es incorrecta: ');
            //biglog('Incorrecta', 'red');
          }

          rl.prompt();
       });  
      

 });
}
*/

exports.testCmd = (socket, rl,id) => {
  validateId(id)
 .then(id => models.quiz.findById(id))
 .then(quiz => {
    if (!quiz){
      throw new Error(`No existe un quiz asociado al id =${id}.`);
    }
    
    return makeQuestion(rl, `${quiz.question} `)
    .then(respuesta => {
      if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
          log(socket, `correct`);
          //log( `La respuesta es correcta.`);
          
      }
      else {
          log(socket, `\bincorrect`);
          //console.log(`La respuesta es incorrecta.`);
      };
    });
 })

 .catch(Sequelize.ValidationError, error =>{
    errorlog(socket, 'El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })

 .catch(error=> {
  errorlog(socket, error.message);
 })

 .then(() => {
   rl.prompt();
  });
};


exports.editCmd = (socket, rl,id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe el parametro asociado ${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
    .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
        return makeQuestion(rl, 'Introduzca la respuesta ')
        .then(a => {
          quiz.question =q;
          quiz.answer =a;
          return quiz;
        });
    });
  })
.then(quiz => {
  return quiz.save();
})
.then(quiz => {
  log (socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
})
.catch(Sequelize.ValidationError, error => {
  errorlog(socket, 'El quiz es erroneo:');
  error.errors.forEach(({message}) => errorlog(socket, message));
})
.catch(error => {
  errorlog(socket, error.message);
})
.then(() => {
  rl.prompt();
});
};



exports.creditsCmd = (socket, rl) => { 
		log(socket, 'Juan José Herrero Bermejo');
		rl.prompt();
	
};



exports.playCmd = (socket, rl) => {

let score = 0; //variable que guarda la puntuación
let toBeResolved = []; //Array con las preguntas que existenç

//Rellenamos el array de quizzes con todas las quizzes existentes
models.quiz.findAll() 
    .then(quizzes => {
      quizzes.forEach((quiz,id) => {
      toBeResolved[id] = quiz; 
    });
  
  const playOne = () => {

      if(toBeResolved.length === 0 /*|| toBeResolved[0] === "undefined" || typeof toBeResolved === "undefined"*/){
        log(socket, `Fin`);
        //log('¡No hay más preguntas!');
        //log(`Su puntuación final es... `);
        //biglog(`${score}`,'red');
        //log("¡¡¡ENHORABUENA!!!",'red'); 
        rl.prompt();
      }
      else {

        let pos = Math.floor(Math.random() * toBeResolved.length);
        //let id = toBeResolved[pos];
        //let quiz = model.getByIndex(id);
        let quiz = toBeResolved[pos];
        toBeResolved.splice(pos, 1); 

        return makeQuestion(rl, `${quiz.question}? `)
        .then(respuesta => { 
          if (String(respuesta.trim().toLowerCase().trim()) === String(quiz.answer.toLowerCase()).trim()){
            score += 1;
            log(socket, `CORRECTA`);
            //log("....................................................................................................");
            //log("Respuesta correcta");
            /*if(score === 1) {  
              log(`Lleva ${score} acierto`);
              playOne();  
            }
            else {  
              log(`Lleva ${score} aciertos`); 
            }*/

              playOne(); 
          }
          else {
              log(socket, `Fin`);
              log(socket, `INCORRECTA`);
              log(socket, `numero de aciertos : ${score}`);
            //log(`Fin`);
            //log(`Fin`);
            //log("FIN DEL JUEGO","red");
            //log(`Su resultado ha sido:`);
            //biglog(`${score}`,'red');
            //log("¡Pruebe otra vez!\n");
          }
        })
        .catch(error => {
        errorlog(socket, error.message);
        })
        .then(() => {
          rl.prompt();
        });
      }
  };

playOne(); 
})
.catch(error => {
      errorlog(socket, error.message);
})    
.then(() =>{
 rl.prompt();
});
};