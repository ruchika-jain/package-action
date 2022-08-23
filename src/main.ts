import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as oras from './oras';

async function run(): Promise<void> {
  try {
    const TOKEN = core.getInput('token'); 
//     const TOKEN = "token";
   
    core.setSecret(TOKEN);
    const repository: string = process!.env!.GITHUB_REPOSITORY || " ";
    if (repository === " "){
      core.setFailed(`Oops! Could not find Repository!`);
    }
    const repoDetails: string[] = repository.split("/");
    const repositoryOwner: string = repoDetails[0];
    const semver: string = core.getInput('semver');
    
    if (!(await oras.isAvailable())) {
      core.setFailed(`OCI Tooling is required to generate OCI artifacts.`);
      return;
    }
    
    await ghcrLogin(repositoryOwner, TOKEN);
    await publishOciArtifact(repository, semver);

    core.setOutput('package-url', `https://ghcr.io/${repository}:${semver}`);
//     await exec.exec(`touch archive.tar.gz`);
  } 
  catch (error) {
    if (error instanceof Error) core.setFailed("Something failed");
  }
}

async function ghcrLogin(repositoryOwner: string, githubToken: string): Promise<void> {
  try {
    await exec.exec(`oras login ghcr.io`, ['-u', repositoryOwner, '-p', githubToken]);
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Could not login to GHCR!`)
  }
}

async function publishOciArtifact(repository: string, semver: string): Promise<void> {
  try {
    const cmd : string = `oras push ghcr.io/${repository}:${semver}\
     --manifest-config /dev/null:application/vnd.actions.packages\
      ./:application/vnd.actions.packages.layer.v1+tar`
    await exec.exec(cmd);
    core.info("Action package pushed successfully to GHCR!");
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Action package push to GHCR failed!`)
  }
}

run()
