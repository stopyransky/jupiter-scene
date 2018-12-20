
 			precision highp float;
			precision highp int;

			varying vec2 vUv;
        	varying vec3 vPos;
        	varying vec3 vNormal;

    		// shadowmap_pars_vertex
    			#ifdef USE_SHADOWMAP

					#if NUM_DIR_LIGHTS > 0

						uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];
						varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];

					#endif

					#if NUM_SPOT_LIGHTS > 0

						uniform mat4 spotShadowMatrix[ NUM_SPOT_LIGHTS ];
						varying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];

					#endif

					#if NUM_POINT_LIGHTS > 0

						uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHTS ];
						varying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];

					#endif

				#endif

		    void main() {

		        // needed for shadowmap_vertex chunk
		        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
		        vPos = worldPosition.xyz;
		        vNormal = normalMatrix * normal;
		        vUv = uv;

		        // shadowmap_vertex
		        	#ifdef USE_SHADOWMAP

						#if NUM_DIR_LIGHTS > 0

						for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

							vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * worldPosition;

						}

						#endif

						#if NUM_SPOT_LIGHTS > 0

						for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

							vSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * worldPosition;

						}

						#endif

						#if NUM_POINT_LIGHTS > 0

						for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

							vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * worldPosition;

						}

						#endif

					#endif

		        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		        //gl_PointSize = 1.5;
		    }
