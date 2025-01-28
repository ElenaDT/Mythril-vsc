'use strict';

const vscode = require('vscode');
const Docker = require('dockerode');
const docker = new Docker();


const checkDockerImage = async (imageName) => {
  try {
    await docker.ping();
  } catch {
    throw new Error('Docker non è in esecuzione. Per favore, avvia Docker.');
  }

  const images = await docker.listImages();
  const imageExists = images.some(image => image.RepoTags?.includes(imageName));

  if (!imageExists) {
    const progressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: `Scaricamento dell'immagine Docker: ${imageName}`,
      cancellable: false
    };

    await vscode.window.withProgress(progressOptions, async progress => {
      progress.report({ message: 'Download in corso.' });

      const stream = await docker.pull(imageName);

      return new Promise((resolve, reject) => {
        docker.modem.followProgress(
          stream,
          (err, res) => err ? reject(err) : resolve(res),
          event => {
            if (event.progress) {
              progress.report({ 
                message: `${event.status}: ${event.progress}`
              });
            }
          }
        );
      });
    });
  }
};

module.exports = { checkDockerImage };
