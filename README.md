# Pagelio

<img src="assets/icon-128.png" width="80" alt="Ícone do Pagelio">

**Salve a web do seu jeito.** Extensão gratuita e de código aberto para Chrome e Edge. Sem conta, assinatura, telemetria ou serviço de processamento remoto.

## O que já funciona

- **PDF:** abre a impressão do navegador. Escolha “Salvar como PDF”. Mantém o layout do site ou gera uma leitura limpa, somente com texto e origem.
- **Captura da área visível e da página inteira:** prévia antes de salvar em PNG, JPG ou WebP. A página inteira é montada por rolagem.
- **Galeria de imagens:** imagens carregadas e fundos CSS, seleção múltipla, pesquisa e filtro por dimensões. Até 100 downloads por operação, em uma pasta com o nome da página.
- **Texto:** exporta a seleção atual ou o texto do conteúdo principal em TXT, com título e endereço.
- **Links:** exporta links únicos do conteúdo principal em TXT.
- Preferência de leitura limpa salva localmente.

## Instalação local

1. Baixe ou clone o projeto em uma pasta.
2. Abra `chrome://extensions` no Chrome ou `edge://extensions` no Edge.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e escolha a pasta que contém `manifest.json`.
5. Fixe o Pagelio na barra do navegador, abra um site e clique no ícone.

Não é necessário instalar Node para usar a extensão. Esta versão ainda não foi publicada nas lojas.

## Privacidade e permissões

Veja [PRIVACY.md](PRIVACY.md). As únicas permissões são `activeTab`, `scripting`, `downloads` e `storage`. O acesso à página é iniciado pelo usuário ao clicar na extensão; não há acesso permanente a todos os sites, histórico de navegação ou execução remota de código.

As prévias e os downloads de imagens acessam os servidores originais das imagens. Isso pode gerar requisições a esses sites, mas nenhum conteúdo é enviado a servidores do Pagelio.

## Limites desta primeira versão

- Páginas internas do navegador, lojas de extensões e alguns visualizadores não permitem acesso.
- PDF usa a janela de impressão; o destino e o nome final são escolhidos nela. Leitura limpa é uma extração simples por `article`/`main`, sem imagens; a qualidade varia por site.
- Capturas inteiras exigem que a aba de origem permaneça ativa e a janela mantenha o tamanho. A rolagem original é restaurada ao terminar. Não interaja com a página durante a captura.
- Limite de captura: 24.000 pixels CSS de altura, 32.000 pixels de saída em altura e 65 milhões de pixels no total. Páginas infinitas, vídeos, elementos animados, barras fixas e conteúdos com rolagem própria podem produzir resultados parciais. O conteúdo carregado durante a captura pode alterar a composição.
- A galeria lê o documento principal, sem percorrer iframes ou shadow DOM. Fundos CSS são detectados nos primeiros 5.000 elementos e usam dimensões de exibição. Não extrai vídeos nem imagens ainda não carregadas.
- Alguns sites impedem downloads diretos. O contador informa downloads iniciados; confira a conclusão no navegador. O navegador pode pedir autorização para múltiplos downloads.

## Desenvolvimento

Node.js 20 ou superior:

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run package
```

O pacote instalável é gerado em `dist/pagelio-0.1.0.zip`. O empacotamento usa Python 3, sem bibliotecas adicionais. O código da extensão não possui dependências de execução, compilação, CDN ou fontes remotas.

Os testes de navegador usam um perfil descartável e uma cópia temporária da extensão com `host_permissions: ["<all_urls>"]`, para automatizar as capturas sem clicar na barra do navegador. Esse perfil navega apenas para a página local de testes. O manifesto distribuído permanece sem `host_permissions`. A concessão de `activeTab` pelo clique e a impressão nativa devem ser conferidas manualmente em ambos os navegadores.

## Próximas ideias

- Recortar uma região e adicionar setas, destaques e desfoque antes de salvar.
- Baixar imagens selecionadas em um único ZIP.
- Exportar artigos em Markdown preservando títulos e links.
- Biblioteca local com etiquetas e busca, opcional e com controle de exclusão.
- Combinar páginas em um caderno com capa e sumário.
- Traduções e acessibilidade aprimorada.

## Contribuir

Leia [CONTRIBUTING.md](CONTRIBUTING.md). Relatos de problemas, sugestões e pull requests são bem-vindos. Licença [MIT](LICENSE).

## Identidade visual

O ícone foi gerado com a ferramenta integrada de imagens e está em `assets/icon-source.png`, com versões de 16, 32, 48 e 128 px. Prompt: página dobrada formando um P abstrato, detalhe de enquadramento de captura, papel marfim sobre quadrado azul cobalto, formas planas e legíveis, sem texto, sombras ou gradientes.
