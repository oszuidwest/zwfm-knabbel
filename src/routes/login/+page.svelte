<script lang="ts">
  import { authApi } from '$lib/api/auth'
  import { AudioWaveform, Grid2x2 } from '$lib/components/icons'

  let ssoLoading = $state(false)

  function handleSsoLogin(): void {
    ssoLoading = true
    authApi.oauthLogin()
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
  <div class="card w-full max-w-md bg-base-100">
    <div class="card-body">
      <div class="mb-6 flex flex-col items-center">
        <div
          class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80"
        >
          <AudioWaveform
            aria-hidden="true"
            class="h-10 w-10 text-primary-content"
          />
        </div>
        <h1 class="page-title">Babbel</h1>
        <p class="page-subtitle">Nieuwsbulletinsysteem</p>
      </div>

      <button
        type="button"
        class="btn w-full btn-primary"
        onclick={handleSsoLogin}
        disabled={ssoLoading}
      >
        {#if ssoLoading}
          <span class="loading loading-sm loading-spinner"></span>
        {:else}
          <Grid2x2
            aria-hidden="true"
            class="h-5 w-5"
          />
        {/if}
        Inloggen met Microsoft
      </button>
    </div>
  </div>
</div>
