'use strict';

const vscode = require('vscode');
const Docker = require('dockerode');
const docker = new Docker();

async function checkDockerImage(imageName) {
  try {
    await docker.ping();
  } catch (err) {
    throw new Error('Docker non è in esecuzione. Per favore, avvia Docker.');
  }

  const images = await docker.listImages();
  const imageExists = images.some((image) =>
    image.RepoTags?.includes(imageName)
  );

  if (!imageExists) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Scaricamento dell'immagine Docker: ${imageName}`,
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Download in corso.' });
        await new Promise((resolve, reject) => {
          docker.pull(imageName, {}, (err, stream) => {
            if (err) {
              return reject(
                new Error(
                  `Impossibile scaricare l'immagine Docker: ${err.message}`
                )
              );
            }
            docker.modem.followProgress(
              stream,
              (err, res) => (err ? reject(err) : resolve(res)),
              (event) => {
                if (event.progress) {
                  progress.report({
                    message: `${event.status}: ${event.progress}`,
                  });
                }
              }
            );
          });
        });
      }
    );
  }
}

module.exports = {
  checkDockerImage,
};
