
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

// ========================================
// ELEMENTOS DO HTML
// ========================================

const areaLider = document.getElementById("areaLider");
const listaPendentes = document.getElementById("listaPendentes");

const areaPerfil = document.getElementById("areaPerfil");
const boasVindasPerfil = document.getElementById("boasVindasPerfil");

const botaoEntrar = document.getElementById("botaoEntrar");
const botaoCadastro = document.getElementById("botaoCadastro");

const areaLogin = document.getElementById("areaLogin");
const tituloFormulario = document.getElementById("tituloFormulario");

const formularioAuth = document.getElementById("formularioAuth");

const email = document.getElementById("email");
const senha = document.getElementById("senha");

const botaoEnviar = document.getElementById("botaoEnviar");
const botaoRecuperar = document.getElementById("botaoRecuperar");
const mensagem = document.getElementById("mensagem");

// Controla se o formulário está em modo de cadastro
let modoCadastro = false;

// ========================================
// MOSTRAR MENSAGENS
// ========================================

function mostrarMensagem(texto, tipo = "") {
    mensagem.textContent = texto;

    mensagem.className = "";

    if (tipo === "sucesso") {
        mensagem.classList.add("mensagem-sucesso");
    }

    if (tipo === "erro") {
        mensagem.classList.add("mensagem-erro");
    }
}

// ========================================
// ABRIR TELA DE LOGIN
// ========================================

botaoCadastro.addEventListener("click", () => {
    modoCadastro = true;

    areaLogin.hidden = false;

    tituloFormulario.textContent = "Entrar na conta";
    botaoEnviar.textContent = "Entrar";

    senha.autocomplete = "current-password";

    mostrarMensagem("");

    areaLogin.scrollIntoView({ behavior: "smooth" });
});

// ========================================
// ABRIR TELA DE CADASTRO
// ========================================

botaoCadastro.addEventListener("click", () => {
    modoCadastro = true;

    areaLogin.hidden = false;

    tituloFormulario.textContent = "Criar conta";
    botaoEnviar.textContent = "Cadastrar";

    senha.autocomplete = "new-password";

    mostrarMensagem("");

    areaLogin.scrollIntoView({ behavior: "smooth" });
});

// ========================================
// CADASTRO E LOGIN
// ========================================


formularioAuth.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const emailDigitado = email.value.trim();
    const senhaDigitada = senha.value;

    if (!emailDigitado || !senhaDigitada) {
        mostrarMensagem("Preencha o e-mail e a senha.", "erro");
        return;
    }

    botaoEnviar.disabled = true;
    mostrarMensagem("Aguarde...");

    try {
        if (modoCadastro) {
            // Cria a conta no Firebase Authentication
            console.log("Modo cadastro:", modoCadastro);
            const resultado = await createUserWithEmailAndPassword(
                auth,
                emailDigitado,
                senhaDigitada
            );

            
const usuario = resultado.user;

// Salva o perfil do novo integrante
await setDoc(doc(db, "usuarios", usuario.uid), {
    email: emailDigitado,
    status: "pendente",
    cargo: "integrante"
});

// Desconecta a conta recém-criada
await signOut(auth);

mostrarMensagem(
    "Cadastro realizado! Aguarde a aprovação do líder para entrar.",
    "sucesso"
);


        } else {
            // Faz login com uma conta existente
            await signInWithEmailAndPassword(
                auth,
                emailDigitado,
                senhaDigitada
            );

            mostrarMensagem(
                "Login realizado com sucesso!",
                "sucesso"
            );
        }

        formularioAuth.reset();

    } catch (erro) {
        console.error("Erro de autenticação:", erro);

        switch (erro.code) {
            case "auth/email-already-in-use":
                mostrarMensagem("Este e-mail já possui uma conta.", "erro");
                break;

            case "auth/invalid-email":
                mostrarMensagem("Digite um endereço de e-mail válido.", "erro");
                break;

            case "auth/weak-password":
                mostrarMensagem("A senha é muito fraca. Use uma senha mais forte.", "erro");
                break;

            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                mostrarMensagem("E-mail ou senha incorretos.", "erro");
                break;

            case "auth/too-many-requests":
                mostrarMensagem("Muitas tentativas. Aguarde um pouco e tente novamente.", "erro");
                break;

            default:
                mostrarMensagem(
                    "Não foi possível concluir a operação. Confira sua conexão e as configurações do Firebase.",
                    "erro"
                );
        }

    } finally {
        botaoEnviar.disabled = false;
    }
});


// ========================================
// RECUPERAR SENHA
// ========================================

botaoRecuperar.addEventListener("click", async () => {
    const emailDigitado = email.value.trim();

    if (!emailDigitado) {
        mostrarMensagem(
            "Digite seu e-mail para solicitar a recuperação.",
            "erro"
        );
        email.focus();
        return;
    }

    try {
        await sendPasswordResetEmail(auth, emailDigitado);

        mostrarMensagem(
            "Se o endereço estiver cadastrado, você receberá instruções para redefinir a senha.",
            "sucesso"
        );

    } catch (erro) {
        console.error("Erro ao recuperar senha:", erro);

        mostrarMensagem(
            "Não foi possível solicitar a recuperação. Confira o e-mail e tente novamente.",
            "erro"
        );
    }
});



onAuthStateChanged(auth, async (usuario) => {
if (!usuario) {
    areaLogin.hidden = false;
    areaPerfil.hidden = true;
    areaLider.hidden = true;
    return;
}

    try {
        // Busca o perfil do usuário no Firestore
        const referenciaUsuario = doc(db, "usuarios", usuario.uid);
        const resultado = await getDoc(referenciaUsuario);

        // Verifica se o perfil existe e está aprovado
        if (resultado.exists() && resultado.data().status === "aprovado") {
            areaLogin.hidden = true;
            areaPerfil.hidden = false;

            boasVindasPerfil.textContent =
                `Bem-vindo! ${usuario.email}`;

            await verificarAcessoLider(usuario);

        } else {
            // Usuário pendente ou sem perfil
            await signOut(auth);

            areaLogin.hidden = false;
            areaPerfil.hidden = true;

            mostrarMensagem(
                "Seu cadastro ainda aguarda aprovação do líder.",
                "erro"
            );
        }
    } catch (erro) {
        console.error("Erro ao verificar aprovação:", erro);

        areaPerfil.hidden = true;
        mostrarMensagem(
            "Não foi possível verificar sua aprovação. Tente novamente.",
            "erro"
        );
    }
});


const botaoSair = document.getElementById("botaoSair");

botaoSair.addEventListener("click", async () => {
    try {
        await signOut(auth);

        areaPerfil.hidden = true;
        areaLogin.hidden = true;

        mostrarMensagem("Você saiu da sua conta.", "sucesso");

    } catch (erro) {
        console.error("Erro ao sair:", erro);
    }
});


async function carregarPendentes() {
    listaPendentes.textContent = "Carregando cadastros...";

    try {
        const referenciaUsuarios = collection(db, "usuarios");
        const resultado = await getDocs(referenciaUsuarios);

        listaPendentes.innerHTML = "";

        let quantidadePendentes = 0;

        resultado.forEach((documento) => {
            const usuario = documento.data();

            if (usuario.status === "pendente") {
                quantidadePendentes++;

                const cartao = document.createElement("div");
                cartao.classList.add("cartao-pendente");

                
const emailUsuario = document.createElement("p");
emailUsuario.textContent = usuario.email;

// Botão para aprovar
const botaoAprovar = document.createElement("button");
botaoAprovar.textContent = "Aprovar";


botaoAprovar.addEventListener("click", async () => {
    botaoAprovar.disabled = true;
    botaoRecusar.disabled = true;

    try {
        await updateDoc(doc(db, "usuarios", documento.id), {
            status: "aprovado"
        });

        await carregarPendentes();
    } catch (erro) {
        console.error("Erro ao aprovar:", erro);
        alert("Não foi possível aprovar. Verifique as permissões.");
    } finally {
        botaoAprovar.disabled = false;
        botaoRecusar.disabled = false;
    }
});


// Botão para recusar
const botaoRecusar = document.createElement("button");
botaoRecusar.textContent = "Recusar";

botaoRecusar.addEventListener("click", async () => {
    const confirmar = confirm(
        `Deseja recusar o cadastro de ${usuario.email}?`
    );

    if (!confirmar) return;

    try {
        await updateDoc(doc(db, "usuarios", documento.id), {
            status: "recusado"
        });

        await carregarPendentes();
    } catch (erro) {
        console.error("Erro ao recusar:", erro);
        alert("Não foi possível recusar. Verifique as permissões.");
    }
});

// Adiciona os elementos ao cartão
cartao.appendChild(emailUsuario);
cartao.appendChild(botaoAprovar);
cartao.appendChild(botaoRecusar);

listaPendentes.appendChild(cartao);

            }
        });

        if (quantidadePendentes === 0) {
            listaPendentes.textContent =
                "Não existem cadastros pendentes.";
        }

    } catch (erro) {
        console.error("Erro ao buscar pendentes:", erro);

        listaPendentes.textContent =
            "Não foi possível carregar os cadastros.";
    }
}


async function verificarAcessoLider(usuario) {
    try {
        const referenciaUsuario = doc(db, "usuarios", usuario.uid);
        const resultado = await getDoc(referenciaUsuario);

        if (
            resultado.exists() &&
            resultado.data().status === "aprovado" &&
            resultado.data().cargo === "lider"
        ) {
            areaLider.hidden = false;
            await carregarPendentes();
        } else {
            areaLider.hidden = true;
        }
    } catch (erro) {
        console.error("Erro ao verificar líder:", erro);
        areaLider.hidden = true;
    }
}
