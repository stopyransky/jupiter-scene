			uniform vec3 ambientLightColor;

			struct PointLight {
				vec3 color;
				vec3 position;
				float distance;
				float decay;

				int shadow;
				float shadowBias;
				float shadowRadius;
				vec2 shadowMapSize;
			};

			uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

			uniform float opacity;
			uniform float mixRatio;
			uniform float staticRatio;
			uniform sampler2D tDiffuse1;
			uniform sampler2D tDiffuse2;
			uniform sampler2D tDiffuse3;

			varying vec3 vPos;
			varying vec2 vUv;
			varying vec3 vNormal;

			// packing
		 	vec3 packNormalToRGB( const in vec3 normal ) {
			  return normalize( normal ) * 0.5 + 0.5;
			}

			vec3 unpackRGBToNormal( const in vec3 rgb ) {
			  return 1.0 - 2.0 * rgb.xyz;
			}

			const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
			const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

			const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
			const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

			const float ShiftRight8 = 1. / 256.;

			vec4 packDepthToRGBA( const in float v ) {

				vec4 r = vec4( fract( v * PackFactors ), v );
				r.yzw -= r.xyz * ShiftRight8; // tidy overflow
				return r * PackUpscale;

			}

			float unpackRGBAToDepth( const in vec4 v ) {

				return dot( v, UnpackFactors );

			}

			// NOTE: viewZ/eyeZ is < 0 when in front of the camera per OpenGL conventions

			float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
			  return ( viewZ + near ) / ( near - far );
			}
			float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
			  return linearClipZ * ( near - far ) - near;
			}

			float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
			  return (( near + viewZ ) * far ) / (( far - near ) * viewZ );
			}
			float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
			  return ( near * far ) / ( ( far - near ) * invClipZ - far );
			}
			// shadowmap_pars_fragment
			#ifdef USE_SHADOWMAP

				#if NUM_DIR_LIGHTS > 0

					uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];
					varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];

				#endif

				#if NUM_SPOT_LIGHTS > 0

					uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHTS ];
					varying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];

				#endif

				#if NUM_POINT_LIGHTS > 0

					uniform sampler2D pointShadowMap[ NUM_POINT_LIGHTS ];
					varying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];

				#endif

				float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {

					return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );

				}

				float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {

					const vec2 offset = vec2( 0.0, 1.0 );

					vec2 texelSize = vec2( 1.0 ) / size;
					vec2 centroidUV = floor( uv * size + 0.5 ) / size;

					float lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );
					float lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );
					float rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );
					float rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );

					vec2 f = fract( uv * size + 0.5 );

					float a = mix( lb, lt, f.y );
					float b = mix( rb, rt, f.y );
					float c = mix( a, b, f.x );

					return c;

				}

				float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

					shadowCoord.xyz /= shadowCoord.w;
					shadowCoord.z += shadowBias;

					// if ( something && something ) breaks ATI OpenGL shader compiler
					// if ( all( something, something ) ) using this instead

					bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
					bool inFrustum = all( inFrustumVec );

					bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

					bool frustumTest = all( frustumTestVec );

					if ( frustumTest ) {

					#if defined( SHADOWMAP_TYPE_PCF )

						vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

						float dx0 = - texelSize.x * shadowRadius;
						float dy0 = - texelSize.y * shadowRadius;
						float dx1 = + texelSize.x * shadowRadius;
						float dy1 = + texelSize.y * shadowRadius;

						return (
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
							texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
						) * ( 1.0 / 9.0 );

					#elif defined( SHADOWMAP_TYPE_PCF_SOFT )

						vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

						float dx0 = - texelSize.x * shadowRadius;
						float dy0 = - texelSize.y * shadowRadius;
						float dx1 = + texelSize.x * shadowRadius;
						float dy1 = + texelSize.y * shadowRadius;

						return (
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
							texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
						) * ( 1.0 / 9.0 );

					#else // no percentage-closer filtering:

						return texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );

					#endif

					}

					return 1.0;

				}

				// cubeToUV() maps a 3D direction vector suitable for cube texture mapping to a 2D
				// vector suitable for 2D texture mapping. This code uses the following layout for the
				// 2D texture:
				//
				// xzXZ
				//  y Y
				//
				// Y - Positive y direction
				// y - Negative y direction
				// X - Positive x direction
				// x - Negative x direction
				// Z - Positive z direction
				// z - Negative z direction
				//
				// Source and test bed:
				// https://gist.github.com/tschw/da10c43c467ce8afd0c4

				vec2 cubeToUV( vec3 v, float texelSizeY ) {

					// Number of texels to avoid at the edge of each square

					vec3 absV = abs( v );

					// Intersect unit cube

					float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
					absV *= scaleToCube;

					// Apply scale to avoid seams

					// two texels less per square (one texel will do for NEAREST)
					v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );

					// Unwrap

					// space: -1 ... 1 range for each square
					//
					// #X##		dim    := ( 4 , 2 )
					//  # #		center := ( 1 , 1 )

					vec2 planar = v.xy;

					float almostATexel = 1.5 * texelSizeY;
					float almostOne = 1.0 - almostATexel;

					if ( absV.z >= almostOne ) {

						if ( v.z > 0.0 )
							planar.x = 4.0 - v.x;

					} else if ( absV.x >= almostOne ) {

						float signX = sign( v.x );
						planar.x = v.z * signX + 2.0 * signX;

					} else if ( absV.y >= almostOne ) {

						float signY = sign( v.y );
						planar.x = v.x + 2.0 * signY + 2.0;
						planar.y = v.z * signY - 2.0;

					}

					// Transform to UV space

					// scale := 0.5 / dim
					// translate := ( center + 0.5 ) / dim
					return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );

				}

				float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

					vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );

					// for point lights, the uniform @vShadowCoord is re-purposed to hold
					// the distance from the light to the world-space position of the fragment.
					vec3 lightToPosition = shadowCoord.xyz;

					// bd3D = base direction 3D
					vec3 bd3D = normalize( lightToPosition );
					// dp = distance from light to fragment position
					float dp = ( length( lightToPosition ) - shadowBias ) / 1000.0;

					#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT )

						vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;

						return (
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
							texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
						) * ( 1.0 / 9.0 );

					#else // no percentage-closer filtering

						return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );

					#endif

				}

			#endif
			// shadowmask pars fragment

			float getShadowMask() {

				float shadow = 1.0;

				#ifdef USE_SHADOWMAP

				#if NUM_DIR_LIGHTS > 0

				DirectionalLight directionalLight;

				for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

					directionalLight = directionalLights[ i ];
					shadow *= bool( directionalLight.shadow ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;

				}

				#endif

				#if NUM_SPOT_LIGHTS > 0

				SpotLight spotLight;

				for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

					spotLight = spotLights[ i ];
					shadow *= bool( spotLight.shadow ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;

				}

				#endif

				#if NUM_POINT_LIGHTS > 0

				PointLight pointLight;

				for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

					pointLight = pointLights[ i ];
					shadow *= bool( pointLight.shadow ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;

				}

				#endif

				#endif

				return shadow;

			}

			// main
			void main() {

				vec4 texel1 = texture2D( tDiffuse1, vUv ); //frame i
				vec4 texel2 = texture2D( tDiffuse2, vUv ); // frame i + 1
				vec4 texel3 = texture2D( tDiffuse3, vUv ); // static texture (background)
				texel1.xyz = pow( texel1.xyz, vec3( 1.7 ) ); // gamma correction
				texel2.xyz = pow( texel2.xyz, vec3( 1.7 ) ); // gamma correction
				float m = 1.0;
			    float m1 = smoothstep( 0.18, 0.22, vUv.y ); // 0 --- 0.25 = 0, 0.25 --- 0.3 = mix, 0.3 --- 1 = 1.0
			    float m2 = 1.0 - smoothstep( 0.75, 0.82, vUv.y );
			    m = m1 * m2;
				vec4 dynamic = mix( texel1, texel2, mixRatio );

				// light
				vec4 sumLights = vec4( 0.1, 0.1, 0.1, 1.0 );


				for( int i = 0; i < NUM_POINT_LIGHTS; i++ ) {
					vec3 lightDirection = normalize( pointLights[i].position - vPos );

					sumLights.rgb += vec3( max(0.0, dot( vNormal, lightDirection ) ) ) * pointLights[i].color ;
				}

				sumLights.rgb += ambientLightColor;

				sumLights *= ( getShadowMask() );

				gl_FragColor =  sumLights * ( opacity * mix( texel3, dynamic, staticRatio * m ) ) ;

			}
