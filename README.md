# Solana Anchor PDA Vault Example

This repository contains a simple Solana program built with the [Anchor framework](https://www.anchor-lang.com/) demonstrating the initialization of a Program Derived Address (PDA).

## Background

This project serves as a basic example of creating and initializing a PDA account. Notably, the development environment is containerized using Docker to overcome significant toolchain compatibility issues encountered during initial development (specifically involving conflicts between Rust versions, Solana CLI versions, Anchor versions, and their respective dependencies like GLIBC).

Using Docker ensures a consistent and reproducible build environment, isolating the project from local machine configuration problems.

## Features

Currently, the program implements one instruction:

*   `initialize_vault`: Creates a new PDA vault account seeded by `b"vault"` and the authority's public key. The account stores:
    *   `owner`: The public key of the authority initializing the vault.
    *   `created_at`: The Unix timestamp of when the vault was created.
    *   `value`: A `u64` value, initialized to `0`.

## Prerequisites

*   [Docker](https://docs.docker.com/get-docker/) installed and running.
*   (Optional) Git for cloning the repository.

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ChiShengChen/anchor_solana_pda.git
    cd solana-pda-vault
    ```

2.  **Build the Docker Image:**
    This command builds the Docker image defined in the `Dockerfile`, which includes specific versions of Ubuntu, Rust, Solana CLI, Node.js, Yarn, and Anchor CLI.
    ```bash
    # You might need sudo depending on your Docker setup
    sudo docker build -t solana-anchor-dev .
    ```
    *Note: The `.dockerignore` file is configured to exclude large directories like `target/`, `node_modules/`, and `test-ledger/` to speed up the build context creation.* 

3.  **Run the Docker Container:**
    This starts an interactive container based on the image we just built. It mounts your current project directory (`solana-pda-vault`) into the container's `/workspace` directory, so changes made inside the container are reflected on your host machine and vice-versa.
    ```bash
    # You might need sudo depending on your Docker setup
    sudo docker run -it --rm -v "$(pwd)":/workspace solana-anchor-dev
    ```
    You will now be inside the container's shell, likely with a prompt like `root@<container_id>:/workspace#`.

    *Troubleshooting Docker Permissions:* If you encounter permission errors running Docker commands without `sudo`, ensure your user is added to the `docker` group (`sudo usermod -aG docker $USER`) and then **log out and log back in** for the changes to take effect.

## Usage (Inside the Container)

All subsequent commands should be run **inside the Docker container shell**.

1.  **Navigate to the Anchor Project:**
    ```bash
    cd anchor_vault
    ```

2.  **Build the Anchor Program:**
    This compiles the Rust code in `programs/anchor_vault/src/lib.rs` into a Solana BPF bytecode program and generates the IDL (Interface Definition Language) JSON file.
    ```bash
    anchor build
    ```
    Compiled program: `target/deploy/anchor_vault.so`
    IDL: `target/idl/anchor_vault.json`

3.  **Run Tests:**
    This command runs the TypeScript tests located in the `tests/` directory using `ts-mocha`.

    *   **Prerequisite:** Ensure `solana-test-validator` is running **on your host machine** (outside the container) and configured to use the correct ports specified in `Anchor.toml` (currently `http://172.17.0.1:8890`).
        ```bash
        # On host machine, in a separate terminal
        solana-test-validator --rpc-port 8890 --faucet-port 9901
        ```
        *Note: `172.17.0.1` is the common IP for the Docker host bridge on Linux. If tests can't connect, verify this IP on your host using `ip addr show docker0` or `ifconfig docker0` and update `Anchor.toml` accordingly.* 

    *   **Run the test command:**
        ```bash
        anchor test
        ```
        This will automatically:
        a. Deploy (or upgrade) your program to the local validator specified in `Anchor.toml` using the wallet specified (`/root/.config/solana/id.json` - it might require creating/airdropping if it's the first time in a container instance).
        b. Execute the tests in `tests/anchor-vault.ts`.

    *   **Expected Output (Example):** You should see output similar to this, indicating the test passed (warnings about version mismatch are expected and can be ignored for now):
        ```text
        WARNING: `anchor-lang` version(0.30.0) and the current CLI version(0.31.0) don't match...
        WARNING: `@coral-xyz/anchor` version(^0.30.0) and the current CLI version(0.31.0) don't match...
            Finished release [optimized] target(s) in ...s
            Finished `test` profile [unoptimized + debuginfo] target(s) in ...s
             Running unittests src/lib.rs (...)
        Deploying cluster: http://172.17.0.1:8890
        Upgrade authority: /root/.config/solana/id.json
        Deploying program "anchor_vault"...
        Program path: /workspace/anchor_vault/target/deploy/anchor_vault.so...
        Program Id: C1Hj34Yrhc2R4vnFbRtABeoRLozAnx9VhgpScg3hHuHp

        Deploy success

        Found a 'test' script in the Anchor.toml. Running it as a test suite!

        Running test suite: "/workspace/anchor_vault/Anchor.toml"

        yarn run v1.22.22
        warning package.json: No license field
        $ /workspace/anchor_vault/node_modules/.bin/ts-mocha -p ./tsconfig.json -t 1000000 'tests/**/*.ts'
        Using authority: CKt5mxDYjxrqVopoped3sLGnXmWKg51BD8TziHWsCMpR


          anchor-vault
        Derived Vault PDA: ErjjcA74E9NCUgSGsGTUqV6qKj8PtsbRLixQFb5vXVcd
        Using Program ID: C1Hj34Yrhc2R4vnFbRtABeoRLozAnx9VhgpScg3hHuHp

        Sending initialize_vault transaction...
        Vault PDA ErjjcA74E9NCUgSGsGTUqV6qKj8PtsbRLixQFb5vXVcd already exists. Skipping initialization.
        Existing Vault Data: {
          owner: 'CKt5mxDYjxrqVopoped3sLGnXmWKg51BD8TziHWsCMpR',
          createdAt: 1744156263, # Timestamp will vary
          value: 0
        }
            ✔ Initializes the Vault PDA! (57ms)


          1 passing (62ms)

        Done in 0.88s.
        ```

## Project Structure

*   `Anchor.toml`: Anchor project configuration file.
*   `Cargo.toml`: Rust workspace configuration.
*   `Dockerfile`: Defines the containerized development environment.
*   `.dockerignore`: Specifies files/directories to exclude from the Docker build context.
*   `programs/anchor_vault/`: Contains the on-chain Solana program code.
    *   `src/lib.rs`: The main Rust source file for the program.
    *   `Cargo.toml`: Dependencies for the on-chain program.
*   `tests/`: Contains TypeScript integration tests.
    *   `anchor-vault.ts`: Test script for the vault program.
*   `target/`: Contains build artifacts.
    *   `deploy/anchor_vault.so`: Compiled BPF program.
    *   `idl/anchor_vault.json`: Program IDL.
    *   `types/anchor_vault.ts`: TypeScript types generated from the IDL.
*   `migrations/deploy.js`: Default Anchor migration script (not currently used).
*   `app/`: Default directory for a frontend application (empty).
*   `node_modules/`: Node.js dependencies.
*   `package.json`, `yarn.lock`: Node.js project configuration.
*   `tsconfig.json`: TypeScript configuration.

## Future Work

*   Implement an `update_vault` instruction to modify the `value` field.
*   Add more comprehensive tests.
*   Develop a simple frontend interface. 
