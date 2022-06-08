import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as oras from './oras';

async function run(): Promise<void> {
  try {
    const TOKEN = core.getInput('token'); 
    core.setSecret(TOKEN);
    const repoInput: string = core.getInput('repository');
    const repoDetails: string[] = repoInput.split("/");
    const repositoryOwner: string = repoDetails[0];
    const repositoryName: string = repoDetails[1];
    const packageName: string = core.getInput('package-name') === repoInput ? repositoryName : core.getInput('package-name');
    const semver: string = core.getInput('semver');
    
    if (!(await oras.isAvailable())) {
      core.setFailed(`Oras is required to generate OCI artifacts.`);
      return;
    }
    
    await ghcrLogin(repositoryOwner, TOKEN);
    await publishOciArtifact(repositoryOwner, semver, packageName);

    core.setOutput('package-name', packageName);

    // await cosignGenerateKeypair(TOKEN);
    // await signPackage(repoDetails, semver, packageName);
  } 
  catch (error) {
    if (error instanceof Error) core.setFailed("Something failed");
  }
}

async function ghcrLogin(repositoryOwner: string, githubToken: string): Promise<void> {
  try {
    await exec.exec(`echo ${githubToken} | oras login ghcr.io`, ['-u', repositoryOwner, '--password-stdin'])
    console.log("Oras logged in successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Oras login failed!`)
  }
}

async function publishOciArtifact(repositoryOwner: string, semver: string, packageName: string): Promise<void> {
  try {
    const cmd : string = `oras push ghcr.io/${repositoryOwner}/${packageName}:${semver}\
     --manifest-config /dev/null:application/vnd.actions.packages\
      ./:application/vnd.actions.packages.layer.v1+tar`
    await exec.exec(cmd);
    console.log("Oras artifacts pushed successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Action package push to GHCR failed!`)
  }
}

async function cosignGenerateKeypair(token: string): Promise<void> {
  try {
    process.env.COSIGN_PASSWORD = token;
    const cmd : string = `cosign generate-key-pair`;
    await exec.exec(cmd)
    console.log("Private public keypair generated successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops!Generating Cosign keypair failed!`)
  }
}

async function signPackage(repositoryOwner: string[], semver: string, packageName: string): Promise<void> {
  try {
    const cmd : string = `cosign sign --key cosign.key ghcr.io/${repositoryOwner}/${packageName}:${semver}`;
    await exec.exec(cmd)
    console.log("Signature pushed successfully to registry!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Signature failed!`)
  }
}

run()
