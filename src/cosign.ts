import * as exec from '@actions/exec';

export async function isAvailable(): Promise<boolean> {
  try{
    const res = await exec
              .getExecOutput('cosign', ['--h'], {
                ignoreReturnCode: true,
                silent: true
              })
    if (res.stderr.length > 0 && res.exitCode !== 0) {
            return false;
    }
    return res.exitCode === 0;
  } catch ( err ) {
    return false;
  }
}