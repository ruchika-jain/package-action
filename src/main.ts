import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {wait} from './wait'
import * as docker from './docker';
import * as oras from './oras';

async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
    
    const TOKEN = core.getInput('token'); 
    core.setSecret(TOKEN);
    const repo_input: string = core.getInput('repository');
    const repo_owner_and_name: string[] = repo_input.split("/");
    const repository_owner: string = core.getInput('repository_owner')
    const semver: string = core.getInput('semver')

    if (!(await oras.isAvailable())) {
      core.setFailed(`Oras is required to generate OCI artifacts.`);
      return;
    }
    
//     const standalone = !(await docker.isAvailable());
//     if (standalone) {
//       core.info(`Docker info skipped in standalone mode`);
//     } else {
//       await exec.exec('docker', ['version'], {
//         failOnStdErr: false
//       });
//     }
    await GHCR_login(repository_owner, TOKEN);
    await publish_OCI_artifact(repo_owner_and_name, semver)
  } catch (error) {
    if (error instanceof Error) core.setFailed("Something failed")
  }
}
async function GHCR_login(repository_owner: string, github_token: string): Promise<void> {
  try {
    await exec.exec('oras login ghcr.io', ['-u', repository_owner, '-p', github_token])
    console.log("Oras logged in successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oras login failed`)
  }
}
async function publish_OCI_artifact(repository: string[], semver: string): Promise<void> {
  try {
    const cmd : string = `oras push ghcr.io/${repository[0]}/${repository[1]}:${semver}\
     --manifest-config /dev/null:application/vnd.actions.packages.jsaction\
      ./:application/vnd.actions.packages.jsaction.layer.v1+tar`
    await exec.exec(cmd)
    console.log("Oras artifacts pushed successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`GHCR push failed`)
  }
}
async function build_docker_image(repository: string[], semver: string): Promise<void> {
  try {
    const cmd : string = `docker build . --file <file_name> --tag $IMAGE_NAME --label "runnumber=${GITHUB_RUN_ID}`
    await exec.exec(cmd)
    console.log("Docker image built successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`GHCR push failed`)
  }
}

run()
